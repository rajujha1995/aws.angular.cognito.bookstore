import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  private usernameSubject = new BehaviorSubject<string | null>(
    this.getUsername()
  );

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  username$ = this.usernameSubject.asObservable();

  login(tokens: any, username: string) {
    if (this.isBrowser()) {
      sessionStorage.setItem('accessToken', tokens.access_token);
      sessionStorage.setItem('idToken', tokens.id_token);
      sessionStorage.setItem('refreshToken', tokens.refresh_token);
      sessionStorage.setItem('username', username);
    }
    this.isLoggedInSubject.next(true);
    this.usernameSubject.next(username);
  }

  logout() {
    if (this.isBrowser()) {
      sessionStorage.clear();
    }
    this.isLoggedInSubject.next(false);
    this.usernameSubject.next(null);
  }

  private hasToken(): boolean {
    return this.isBrowser() && !!sessionStorage.getItem('accessToken');
  }

  private getUsername(): string | null {
    return this.isBrowser() ? sessionStorage.getItem('username') : null;
  }

  private isBrowser(): boolean {
    return (
      typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
    );
  }
}
