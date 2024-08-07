// book.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../_models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  // private apiUrl: string = 'https://localhost:7182/api/books';
  private apiUrl: string =
    'https://82b8crgwq6.execute-api.us-east-1.amazonaws.com/prod/api/books';

  constructor(private http: HttpClient) {}

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  addBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }
}
