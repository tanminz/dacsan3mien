import { Component, OnInit } from '@angular/core';
import { UserAPIService } from '../user-api.service';
import { User } from '../../interface/User';
import { DateService } from '../services/date.service';

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css']
})
export class PersonalInfoComponent implements OnInit {
  personalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  originalInfo: Partial<User> = {
    birthDate: { day: '', month: '', year: '' }
  };
  isEditing = false;

  months: string[] = [];
  days: number[] = [];
  years: number[] = [];

  constructor(
    private userAPIService: UserAPIService,
    private dateService: DateService
  ) { }

  ngOnInit(): void {
    this.loadUserInfo();
    this.months = this.dateService.getMonths();
    this.days = this.dateService.getDays();
    this.years = this.dateService.getYears();
  }

  loadUserInfo(): void {
    this.userAPIService.getUserDetails().subscribe({
      next: (user) => {
        this.personalInfo = {
          ...user,
          _id: user._id || '',
          birthDate: user?.birthDate || { day: '', month: '', year: '' }
        };
        this.originalInfo = {
          ...user,
          _id: user._id || '',
          birthDate: user?.birthDate || { day: '', month: '', year: '' }
        };
      },
      error: (err) => {
        console.error('Error loading user info:', err);
      }
    });
  }

  editInfo(): void {
    this.isEditing = true;
  }

  saveInfo(): void {
    if (!this.personalInfo._id) {
      return;
    }

    const { _id, ...updateData } = this.personalInfo;

    this.userAPIService.updateUserProfile(this.personalInfo._id, updateData).subscribe({
      next: (res) => {
        this.isEditing = false;
        this.originalInfo = { ...this.personalInfo };
      },
      error: (err) => {
        console.error('Error updating user info:', err);
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.personalInfo = { ...this.originalInfo };
  }
}
