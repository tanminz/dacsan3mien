import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-section-3',
  templateUrl: './product-section-3.component.html',
  styleUrl: './product-section-3.component.css'
})
export class ProductSection3Component implements OnInit {
  products: Product[] = [];
  displayedProducts: Product[] = [];
  errMessage: string = '';
  isLoading: boolean = true;
  initialDisplayCount: number = 3;
  loadMoreCount: number = 3;
  isLoggedIn: boolean = false;

  constructor(
    private router: Router,
    private _service: ProductAPIService,
    private cartService: CartService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });

    this._service.getProducts(1, 100).subscribe({
      next: (data) => {
        this.products = data.products.map(product => {
          const newProduct = new Product(
            product._id || '',
            product.product_name || '',
            product.product_detail || '',
            product.stocked_quantity || 0,
            product.unit_price || 0,
            product.discount || 0,
            product.createdAt || '',
            product.image_1 || '',
            product.image_2 || '',
            product.image_3 || '',
            product.image_4 || '',
            product.image_5 || '',
            product.product_dept || '',
            product.rating || 0
          );
          newProduct.checkIfNew();
          return newProduct;
        });
        
        // Filter products for Miền Nam (you can adjust this filter as needed)
        // For now, we'll take products starting from index 3 as Miền Nam products
        const startIndex = 3;
        this.displayedProducts = this.products.slice(startIndex, startIndex + this.initialDisplayCount);
        this.isLoading = false;
      },
      error: (err) => {
        this.errMessage = "Failed to load products. Please try again later.";
        this.isLoading = false;
      }
    });
  }

  goToDetail(productId: string): void {
    this.router.navigate(['/product', productId]);
  }

  addToCart(event: Event, product: Product): void {
    event.stopPropagation();
    if (product) {
      this.cartService.addToCart(
        product._id,
        1,
        product.unit_price,
        product.product_name,
        product.image_1,
        product.stocked_quantity
      );
    }
  }

  shareOnFacebook(event: Event, product: Product): void {
    event.stopPropagation();
    const productUrl = `${window.location.origin}/product/${product._id}`;
    const quote = `Check out this amazing product: ${product.product_name}! It's available for just ${product.unit_price.toLocaleString()} VND.`;
    const hashtag = '#AmazingProduct #ĐẶC SẢN 3 MIỀN #BeĐẶC SẢN 3 MIỀN';
    
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(quote)}&hashtag=${encodeURIComponent(hashtag)}`;
    window.open(url, '_blank');
  }

  toggleLike(event: Event, productId: string): void {
    event.stopPropagation();
    if (this.isLoggedIn) {
      // Implement like logic here
      console.log('Toggle like:', productId);
    } else {
      alert("Vui lòng đăng nhập để thả tim cho sản phẩm!");
    }
  }

  showMore(): void {
    const currentLength = this.displayedProducts.length;
    const startIndex = 3 + currentLength;
    const additionalProducts = this.products.slice(startIndex, startIndex + this.loadMoreCount);
    this.displayedProducts = [...this.displayedProducts, ...additionalProducts];
  }

  getOriginalPrice(product: Product): number | null {
    if (product.discount && product.discount > 0) {
      const originalPrice = product.unit_price / (1 - product.discount);
      return Math.round(originalPrice / 1000) * 1000;
    }
    return null;
  }
}
