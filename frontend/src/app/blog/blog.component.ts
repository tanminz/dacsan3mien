import { Component } from '@angular/core';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  activeBlog: string | null = null;

  showBlogDetails(blogId: string): void {
    this.activeBlog = this.activeBlog === blogId ? null : blogId;
  }

  showBlogList(): void {
    this.activeBlog = null;
  }
}
