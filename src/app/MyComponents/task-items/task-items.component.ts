import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Task } from '../../Task';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-items.component.html',
  styleUrls: ['./task-items.component.css'],
})
export class TaskItemsComponent implements OnInit, OnDestroy {
  @Input() task: Task = new Task(0, '', '', new Date(), 'low', 'to-do');
  @Input() minTimeLeft: string = ''; 
  @Input() maxOverdueTime: string = '';
  @Output() deleteTask: EventEmitter<Task> = new EventEmitter<Task>();
  @Output() updateTask: EventEmitter<Task> = new EventEmitter<Task>();

  editing: boolean = false;
  editedTask: Task = { ...this.task };
  timeLeft: string = ''; 
  timerId: any; 

  ngOnInit() {
    this.calculateTimeLeft();
    this.timerId = setInterval(() => this.calculateTimeLeft(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId); 
    }
  }

  calculateTimeLeft() {
    const now = new Date().getTime();
    let dueDate = new Date(this.task.dueDate);
    if (isNaN(dueDate.getTime())) {
      this.timeLeft = 'Invalid due date';
      return;
    }

    dueDate.setHours(23, 59, 59, 999);
    const dueDateTime = dueDate.getTime();
    const timeDifference = dueDateTime - now;

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    if (timeDifference > 0) {
      this.timeLeft = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    } else {
      const overdue = Math.abs(timeDifference);
      const overdueDays = Math.floor(overdue / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
      const overdueSeconds = Math.floor((overdue % (1000 * 60)) / 1000);
      this.timeLeft = `Overdue by ${overdueDays}d ${overdueHours}h ${overdueMinutes}m ${overdueSeconds}s`;
    }
  }

  onDeleteTask(task: Task) {
    this.deleteTask.emit(task);
  }

  onEdit() {
    this.editing = true;
    this.editedTask = { ...this.task };
  }

  onSave() {
    this.task.title = this.editedTask.title;
    this.task.desc = this.editedTask.desc;
    this.task.dueDate = this.editedTask.dueDate;
    this.task.priority = this.editedTask.priority;
    this.task.status = this.editedTask.status;
    this.updateTask.emit(this.editedTask);
    this.editing = false;
  }

  onCancel() {
    this.editing = false;
  }

  isFormValid() {
    return (
      this.editedTask.title.trim() !== '' &&
      this.editedTask.desc.trim() !== '' &&
      this.editedTask.dueDate !== undefined &&
      this.editedTask.priority !== undefined &&
      this.editedTask.status !== undefined
    );
  }
}
