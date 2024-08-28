import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Task } from '../../Task';
import { CsvExportService } from '../../services/csv-export.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AddTaskComponent } from '../add-task/add-task.component';
import { TaskItemsComponent } from '../task-items/task-items.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, AddTaskComponent, TaskItemsComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  minTimeLeft: string = '';
  maxOverdueTime: string = '';
  minTaskName: string = '';
  maxTaskName: string = ''; 
  timerId: any; 

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private csvExportService: CsvExportService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const localItem = localStorage.getItem("tasks");
      if (localItem) {
        this.tasks = JSON.parse(localItem);
        this.updateTimers();
        this.timerId = setInterval(() => this.updateTimers(), 1000);
      }
    }
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId); 
    }
  }
  updateTimers() {
    let minTimeLeft = Infinity;
    let maxOverdueTime = -Infinity;
    let minTaskName = '';
    let maxTaskName = '';
    const incompleteTasks = this.tasks.filter(task => task.status !== 'completed');
  
    if (incompleteTasks.length === 0) {
      this.minTimeLeft = 'No upcoming tasks';
      this.maxOverdueTime = 'No overdue tasks';
      this.minTaskName = '';
      this.maxTaskName = '';
      return;
    }
  
    incompleteTasks.forEach(task => {
      const now = new Date().getTime();
      const dueDate = new Date(task.dueDate).getTime();
      const timeDifference = dueDate - now;
  
      if (timeDifference > 0) {
        if (timeDifference < minTimeLeft) {
          minTimeLeft = timeDifference;
          minTaskName = task.title;
        }
      } else {
        if (-timeDifference > maxOverdueTime) {
          maxOverdueTime = -timeDifference;
          maxTaskName = task.title;
        }
      }
    });
  
    if (minTimeLeft === Infinity) {
      this.minTimeLeft = 'No upcoming tasks';
      this.minTaskName = '';
    } else {
      const days = Math.floor(minTimeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((minTimeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((minTimeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((minTimeLeft % (1000 * 60)) / 1000);
      this.minTimeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
      this.minTaskName = minTaskName;
    }
  
    if (maxOverdueTime === -Infinity) {
      this.maxOverdueTime = 'No overdue tasks';
      this.maxTaskName = '';
    } else {
      const days = Math.floor(maxOverdueTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((maxOverdueTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((maxOverdueTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((maxOverdueTime % (1000 * 60)) / 1000);
      this.maxOverdueTime = `Overdue by ${days}d ${hours}h ${minutes}m ${seconds}s`;
      this.maxTaskName = maxTaskName;
    }
  }
  

  onDeleteTask(task: Task) {
    this.tasks = this.tasks.filter(t => t !== task);
    this.updateLocalStorage();
    this.updateTimers();
  }

  onAddTask(task: Task) {
    this.tasks.push(task);
    this.updateLocalStorage();
    this.updateTimers();
  }
  
  onUpdateTask(updatedTask: Task) {
    const index = this.tasks.findIndex(t => t.sNo === updatedTask.sNo);
    if (index !== -1) {
      this.tasks[index] = updatedTask;
      this.updateLocalStorage();
      this.updateTimers(); 
    }
  }

  private updateLocalStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem("tasks", JSON.stringify(this.tasks));
    }
  }
  
  exportTasksToCsv() {
    if (this.tasks.length > 0) {
      this.csvExportService.exportToCsv(this.tasks);
    } else {
      console.log('No tasks to export.');
    }
  }

  sortTasks(criteria: 'dueDate' | 'priority' | 'status') {
    if (criteria === 'dueDate') {
      this.tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (criteria === 'priority') {
      const priorityOrder = { 'low': 1, 'medium': 2, 'high': 3 };
      this.tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (criteria === 'status') {
      const statusOrder = { 'to-do': 1, 'in-progress': 2, 'completed': 3 };
      this.tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
    this.updateLocalStorage();
  }
}
