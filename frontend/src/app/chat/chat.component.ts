import { Component } from '@angular/core';
import { OpenAiService } from '../services/openai.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  isChatOpen = false;
  userMessage = '';
  unreadMessages = 1;
  messages: { role: string; content: string; read?: boolean }[] = [];

  private messageSubject = new Subject<string>();
  private maxMessagesToSend = 10;

  private assistantGreetings = [
    'Xin chào, tôi là Trợ lý ảo. Rất vui được hỗ trợ bạn.',
    'Chào bạn, tôi có thể giúp gì cho bạn hôm nay?',
    'Xin chào! Bạn cần hỗ trợ gì?',
    'Chào mừng bạn! Tôi sẵn sàng hỗ trợ mọi câu hỏi của bạn.',
    'Hi! Bạn cần tìm hiểu gì? Tôi ở đây để giúp bạn.',
    'Xin chào, tôi là Trợ lý của EYECONIC. Rất hân hạnh được phục vụ bạn.',
  ];

  constructor(private openAiService: OpenAiService) {
    this.messageSubject.pipe(debounceTime(1000)).subscribe((message) => {
      this.sendMessageToOpenAi(message);
    });

    this.setRandomGreeting();
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;

    if (this.isChatOpen) {
      this.markMessagesAsRead();
    }
  }

  sendMessage(): void {
    if (this.userMessage.trim() === '') return;

    this.messages.push({ role: 'user', content: this.userMessage, read: true });

    this.messageSubject.next(this.userMessage);

    this.userMessage = '';
  }

  private sendMessageToOpenAi(message: string): void {
    const recentMessages = this.messages.slice(-this.maxMessagesToSend);

    this.openAiService.sendMessage(recentMessages).subscribe({
      next: (response) => {
        const assistantMessage = response.choices[0]?.message?.content || 'No response from assistant.';
        this.messages.push({ role: 'assistant', content: assistantMessage, read: false });
        if (!this.isChatOpen) {
          this.unreadMessages++;
        }
      },
      error: (err) => {
        if (err.message === 'Too many requests. Please try again later.') {
          this.messages.push({ role: 'assistant', content: 'Rate limit exceeded. Please wait and try again.', read: false });
        } else if (err.message === 'Unauthorized. Check your API Key.') {
          this.messages.push({ role: 'assistant', content: 'Invalid API Key. Please check your configuration.', read: false });
        } else {
          this.messages.push({ role: 'assistant', content: 'An error occurred. Please try again later.', read: false });
        }
        if (!this.isChatOpen) {
          this.unreadMessages++;
        }
      },
    });
  }

  private markMessagesAsRead(): void {
    this.messages.forEach((message) => {
      if (message.role === 'assistant') {
        message.read = true;
      }
    });
    this.unreadMessages = 0;
  }

  private setRandomGreeting(): void {
    const randomIndex = Math.floor(Math.random() * this.assistantGreetings.length);
    const randomGreeting = this.assistantGreetings[randomIndex];
    this.messages.push({ role: 'assistant', content: randomGreeting, read: false });
  }
}
