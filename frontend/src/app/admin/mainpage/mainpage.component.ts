import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.css']
})
export class MainpageComponent implements OnInit, OnDestroy {
  profileName: string = 'Admin';
  recentActivities = [
    { category: 'Chức năng', item: 'Blog', name: 'Chè Tân Cương Thái Nguyên', action: 'edit' },
    { category: 'Chức năng', item: 'Sản phẩm', name: 'Mắm cá linh Cà Mau', action: 'edit' },
    { category: 'Chức năng', item: 'Đơn hàng', name: 'Đơn #12345 - Nước mắm Phan Thiết', action: 'view' },
    { category: 'Chức năng', item: 'Blog', name: 'Cá cơm sấy giòn Nghệ An', action: 'edit' },
    { category: 'Chức năng', item: 'Sản phẩm', name: 'Mật ong Mẫu Sơn Lạng Sơn', action: 'edit' },
    { category: 'Chức năng', item: 'Sản phẩm', name: 'Lạp xưởng hun khói Sa Pa', action: 'view' },
    { category: 'Chức năng', item: 'Blog', name: 'Rượu ngô Na Hang Tuyên Quang', action: 'edit' },
    { category: 'Chức năng', item: 'Sản phẩm', name: 'Cà phê Buôn Ma Thuột', action: 'view' },
    { category: 'Chức năng', item: 'Đơn hàng', name: 'Đơn #12346 - Set quà Tết 3 miền', action: 'view' },
    { category: 'Chức năng', item: 'Sản phẩm', name: 'Bánh đậu xanh Hải Dương', action: 'edit' },
  ];
  private subscription: Subscription | null = null;
  private filterRecentActivities(): void {
    const action = this.authService.getAction() || 'just view';
    if (action !== 'edit all') {
      this.recentActivities = this.recentActivities.filter(
        activity => activity.action === action || activity.action === 'view'
      );
    }
  }

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.subscription = this.authService.getUserEmail().subscribe({
      next: (email) => {
        this.profileName = email || 'Admin';
      },
      error: () => {
        this.profileName = 'Admin';
      }
    });
    this.filterRecentActivities();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  navigateToHome(): void {
    window.open('/', '_blank');
  }
}
