import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Product } from '../interface/Product';

@Injectable({
  providedIn: 'root'
})
export class ProductAPIService {
  private apiUrl = '/products';
  private token: string | null = null;

  constructor(private _http: HttpClient) {
    this.token = this.getToken();
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    if (error.status === 0) {
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Invalid request. Please check the data you provided.';
          break;
        case 401:
          errorMessage = 'Unauthorized. Please log in and try again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Requested resource not found.';
          break;
        case 500:
          errorMessage = 'An internal server error occurred. Please try again later.';
          break;
        default:
          errorMessage = error.error?.message || 'An unexpected error occurred. Please try again later.';
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  getProducts(
    page: number = 1,
    limit: number = 10,
    dept: string = ''
  ): Observable<{ products: Product[]; total: number; page: number; pages: number }> {
    const params: any = { page, limit };
    if (dept) {
      params.dept = dept;
    }
    return this._http
      .get<{ products: Product[]; total: number; page: number; pages: number }>(this.apiUrl, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  getProductById(id: string): Observable<Product> {
    return this._http
      .get<Product>(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this._http
      .get<Product[]>(`${this.apiUrl}?dept=${category}`, {
        headers: this.getHeaders()
      })
      .pipe(retry(3), catchError(this.handleError));
  }

  updateProductStock(id: string, quantity: number): Observable<any> {
    if (typeof quantity !== 'number' || quantity <= 0) {
      return throwError(() => new Error('quantity must be a positive number.'));
    }
    return this._http
      .patch(`${this.apiUrl}/${id}/update-stock`, { quantity }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    if (!product.product_name || typeof product.product_name !== 'string') {
      return throwError(() => new Error('product_name is required and must be a string.'));
    }
    if (typeof product.unit_price !== 'number' || product.unit_price < 0) {
      return throwError(() => new Error('unit_price must be a non-negative number.'));
    }
    if (typeof product.stocked_quantity !== 'number' || product.stocked_quantity < 0) {
      return throwError(() => new Error('stocked_quantity must be a non-negative number.'));
    }
    if (product.discount !== undefined && (product.discount < 0 || product.discount > 1)) {
      return throwError(() => new Error('discount must be between 0 and 1.'));
    }
    if (product.rating !== undefined && (product.rating < 0 || product.rating > 5)) {
      return throwError(() => new Error('rating must be between 0 and 5.'));
    }

    const sanitizedProduct: Record<string, any> = { ...product };

    return this._http
      .post<Product>(this.apiUrl, sanitizedProduct, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  updateProduct(id: string, product: Partial<Product>): Observable<any> {
    if (
      product.product_name !== undefined &&
      (typeof product.product_name !== 'string' || !product.product_name.trim())
    ) {
      return throwError(() => new Error('product_name must be a non-empty string.'));
    }
    if (
      product.unit_price !== undefined &&
      (typeof product.unit_price !== 'number' || product.unit_price < 0)
    ) {
      return throwError(() => new Error('unit_price must be a non-negative number.'));
    }
    if (
      product.stocked_quantity !== undefined &&
      (typeof product.stocked_quantity !== 'number' || product.stocked_quantity < 0)
    ) {
      return throwError(() => new Error('stocked_quantity must be a non-negative number.'));
    }
    if (
      product.discount !== undefined &&
      (product.discount < 0 || product.discount > 1)
    ) {
      return throwError(() => new Error('discount must be between 0 and 1.'));
    }
    if (
      product.rating !== undefined &&
      (product.rating < 0 || product.rating > 5)
    ) {
      return throwError(() => new Error('rating must be between 0 and 5.'));
    }

    const sanitizedProduct: Record<string, any> = { ...product };

    return this._http
      .patch(`${this.apiUrl}/${id}`, sanitizedProduct, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  deleteProduct(id: string): Observable<any> {
    return this._http
      .delete(`${this.apiUrl}/${id}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError));
  }

  deleteMultipleProducts(ids: string[]): Observable<any> {
    return this._http
      .request('delete', this.apiUrl, {
        headers: this.getHeaders(),
        body: { productIds: ids }
      })
      .pipe(catchError(this.handleError));
  }
}
