import { Component, OnInit } from '@angular/core';
import { Product } from '../../interface/Product';
import { ProductAPIService } from '../product-api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css']
})
export class ProductCatalogComponent implements OnInit {
  categories: { name: string; image: string; filterKey: string }[] = [];
  selectedCategory: string = 'Tất cả';
  products: Product[] = [];
  filteredProducts: Product[] = [];
  productCount: number = 0;
  isLoading: boolean = true;
  errMessage: string = '';
  priceFilter: string = '';
  tagFilter: string = '';
  searchQuery: string = '';

  constructor(
    private productService: ProductAPIService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initializeCategories();
    this.loadProducts();
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['search'] || '';
      if (this.searchQuery) {
        this.applySearchFilter(this.searchQuery);
      }
    });
  }

  initializeCategories(): void {
    this.categories = [
      { name: 'Tất cả', image: '/assets/Mẫu.png', filterKey: 'Tất cả' },
      { name: 'Kính mắt', image: '/assets/Mẫu.png', filterKey: 'Kính mắt' },
      { name: 'Áp tròng', image: '/assets/Mẫu.png', filterKey: 'Áp tròng' },
      { name: 'Tròng', image: '/assets/Mẫu.png', filterKey: 'Tròng' },
      { name: 'Phụ kiện', image: '/assets/Mẫu.png', filterKey: 'Phụ kiện' },
      { name: 'Kính mát', image: '/assets/Mẫu.png', filterKey: 'Kính mát' },
    ];
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts(1, 100).subscribe({
      next: (data) => {
        this.products = data.products.map(productData => new Product(
          productData._id,
          productData.product_name,
          productData.product_detail,
          productData.stocked_quantity,
          productData.unit_price,
          productData.discount,
          productData.createdAt,
          productData.image_1,
          productData.image_2,
          productData.image_3,
          productData.image_4,
          productData.image_5,
          productData.product_dept,
          productData.rating,
          productData.isNew
        ));

        this.products.forEach(product => product.checkIfNew());
        this.applyFilter(this.selectedCategory);
        if (this.searchQuery) {
          this.applySearchFilter(this.searchQuery);
        }
        this.isLoading = false;
      },
      error: () => {
        this.errMessage = 'Failed to load products. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  applyFilter(category: string): void {
    this.selectedCategory = category;
    this.filteredProducts = category === 'Tất cả'
      ? [...this.products]
      : this.products.filter(product => product.product_dept === category);

    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  applySearchFilter(searchTerm: string): void {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.product_name.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.product_detail.toLowerCase().includes(lowerCaseSearchTerm)
    );
    this.updateProductCount();
  }

  filterByPrice(event: Event): void {
    this.priceFilter = (event.target as HTMLSelectElement).value;
    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  filterByTag(event: Event): void {
    this.tagFilter = (event.target as HTMLSelectElement).value;
    const baseFilteredProducts = this.selectedCategory === 'Tất cả'
      ? this.products
      : this.products.filter(product => product.product_dept === this.selectedCategory);

    this.filteredProducts = baseFilteredProducts.filter(product =>
      this.tagFilter === 'new'
        ? product.isNew
        : this.tagFilter === 'discount'
          ? product.discount > 0
          : true
    );

    this.applyAdditionalFilters(true);
    this.updateProductCount();
  }

  private applyAdditionalFilters(skipTag = false): void {
    if (!skipTag && this.tagFilter) {
      this.filteredProducts = this.filteredProducts.filter(product =>
        this.tagFilter === 'new'
          ? product.isNew
          : this.tagFilter === 'discount'
            ? product.discount > 0
            : true
      );
    }

    if (this.priceFilter) {
      this.filteredProducts.sort((a, b) =>
        this.priceFilter === 'lowToHigh' ? a.unit_price - b.unit_price : b.unit_price - a.unit_price
      );
    }
  }

  private updateProductCount(): void {
    this.productCount = this.filteredProducts.length;
    this.errMessage = this.filteredProducts.length === 0
      ? 'No products found in this category.'
      : '';
  }
}
