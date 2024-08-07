// book.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../_models/book.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(environment.book_apiUrl);
  }

  addBook(book: Book): Observable<Book> {
    return this.http.post<Book>(environment.book_apiUrl, book);
  }
}
