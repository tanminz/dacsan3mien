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
  paginatedProducts: Product[] = [];
  productCount: number = 0;
  isLoading: boolean = true;
  errMessage: string = '';
  priceFilter: string = '';
  tagFilter: string = '';
  searchQuery: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 36;
  totalPages: number = 0;
  totalItems: number = 0;

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
      { name: 'Tất cả', image: '/assets/Mẫu.jpg', filterKey: 'Tất cả' },
      { name: 'Thực phẩm khô', image: '/assets/thực phẩm khô.jpg', filterKey: 'Thực phẩm khô' },
      { name: 'Thức uống', image: '/assets/thucuong.jpg', filterKey: 'Thức uống' },
      { name: 'Bánh kẹo', image: '/assets/aboutanh7.jpg', filterKey: 'Bánh kẹo' },
      { name: 'Thực phẩm đông lạnh', image: '/assets/donglanh.jpg', filterKey: 'Thực phẩm đông lạnh' },
      { name: 'Gia vị', image: '/assets/giavi.jpg', filterKey: 'Gia vị' },
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
    this.currentPage = 1; // Reset to first page when changing category
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
    this.currentPage = 1; // Reset to first page when searching
    this.updateProductCount();
  }

  filterByPrice(event: Event): void {
    this.priceFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page when filtering
    this.applyAdditionalFilters();
    this.updateProductCount();
  }

  filterByTag(event: Event): void {
    this.tagFilter = (event.target as HTMLSelectElement).value;
    this.currentPage = 1; // Reset to first page when filtering
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
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Only reset to first page if current page is beyond total pages
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    this.updatePaginatedProducts();
    this.errMessage = this.filteredProducts.length === 0
      ? 'No products found in this category.'
      : '';
  }

  private updatePaginatedProducts(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
    
    // Debug info
    console.log('Pagination Debug:', {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      itemsPerPage: this.itemsPerPage,
      filteredProductsLength: this.filteredProducts.length,
      paginatedProductsLength: this.paginatedProducts.length,
      startIndex,
      endIndex
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedProducts();
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getEndRange(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
