import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartItem } from '../../interface/Cart';
import { LocationService } from '../services/location.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderAPIService } from '../order-api.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  selectedItems: CartItem[] = [];
  totalPrice: number = 0;
  paymentMethod: string = '';
  provinces: any[] = [];
  districts: any[] = [];
  wards: any[] = [];
  paymentForm: FormGroup;
  isModalVisible: boolean = false;
  modalPaymentMethod: 'momo' | 'internet_banking' = 'momo';

  constructor(
    private cartService: CartService,
    private locationService: LocationService,
    private fb: FormBuilder,
    private router: Router,
    private orderAPIService: OrderAPIService
  ) {
    this.paymentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      company: [''],
      address: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(\+?\d{1,3}[- ]?)?\d{10}$/)]],
      selectedProvince: ['', Validators.required],
      selectedDistrict: ['', Validators.required],
      selectedWard: ['', Validators.required],
      shipToDifferentAddress: [false],
      additionalNotes: [''],
      paymentMethod: ['cash_on_delivery', Validators.required]
    });
  }

  ngOnInit(): void {
    this.selectedItems = this.cartService.getSelectedItems();
    this.calculateTotalPrice();
    this.loadProvinces();
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.selectedItems.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  }

  placeOrder(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      alert('Vui lòng điền đầy đủ thông tin trước khi đặt hàng.');
      return;
    }

    if (this.selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

    const paymentMethod = this.paymentForm.value.paymentMethod;

    if (paymentMethod === 'internet_banking' || paymentMethod === 'momo') {
      this.modalPaymentMethod = paymentMethod;
      this.openModal();
    } else {
      this.processOrder();
    }
  }

  openModal(): void {
    this.isModalVisible = true;
  }

  closeModal(): void {
    this.isModalVisible = false;
  }

  handlePaymentSuccess(): void {
    this.isModalVisible = false;
    this.processOrder();
  }

  processOrder(): void {
    const insufficientStockItems = this.selectedItems.filter(item =>
      item.stocked_quantity !== undefined && item.quantity > item.stocked_quantity
    );

    if (insufficientStockItems.length > 0) {
      let message = 'Một số sản phẩm vượt quá số lượng hàng tồn kho:\n';
      insufficientStockItems.forEach(item => {
        message += `- ${item.product_name}: ${item.quantity} (tồn kho: ${item.stocked_quantity})\n`;
        item.quantity = item.stocked_quantity!;
      });
      alert(message);
      this.calculateTotalPrice();
      return;
    }

    const orderedItems = this.selectedItems.map(item => ({
      _id: item.productId as string,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const orderData = {
      selectedItems: orderedItems,
      totalPrice: this.totalPrice,
      paymentMethod: this.paymentForm.value.paymentMethod,
      shippingAddress: {
        firstName: this.paymentForm.value.firstName,
        lastName: this.paymentForm.value.lastName,
        company: this.paymentForm.value.company,
        address: this.paymentForm.value.address,
        province: this.getSelectedProvinceName(),
        district: this.getSelectedDistrictName(),
        ward: this.getSelectedWardName(),
        email: this.paymentForm.value.email,
        phone: this.paymentForm.value.phone,
        additionalNotes: this.paymentForm.value.additionalNotes
      }
    };

    this.orderAPIService.placeOrder(orderData).subscribe({
      next: () => {
        alert('Đơn hàng của bạn đã được đặt thành công!');
        this.cartService.removeOrderedItems(orderedItems.map(item => item._id));
        this.cartService.clearSelectedItems();
        this.router.navigate(['/']);
      },
      error: (err) => {
        if (err.message.includes('Insufficient stock')) {
          alert('Một số sản phẩm không còn đủ hàng trong kho. Vui lòng cập nhật lại giỏ hàng.');
        } else {
          alert('Đặt hàng thất bại. Vui lòng thử lại.');
        }
      }
    });
  }

  loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: data => {
        this.provinces = data;
      },
      error: err => {
        alert('Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.');
      }
    });
  }

  onProvinceChange(): void {
    const selectedProvinceCode = this.paymentForm.get('selectedProvince')?.value;
    if (selectedProvinceCode) {
      this.locationService.getDistricts(selectedProvinceCode).subscribe({
        next: data => {
          this.districts = data.districts || [];
          this.wards = [];
          this.paymentForm.patchValue({ selectedDistrict: '', selectedWard: '' });
        },
        error: err => {
          alert('Không thể tải danh sách quận/huyện. Vui lòng thử lại.');
          this.districts = [];
        }
      });
    } else {
      this.districts = [];
      this.wards = [];
    }
  }

  onDistrictChange(): void {
    const selectedDistrictCode = this.paymentForm.get('selectedDistrict')?.value;
    if (selectedDistrictCode) {
      this.locationService.getWards(selectedDistrictCode).subscribe({
        next: data => {
          this.wards = data.wards || [];
          this.paymentForm.patchValue({ selectedWard: '' });
        },
        error: err => {
          alert('Không thể tải danh sách phường/xã. Vui lòng thử lại.');
          this.wards = [];
        }
      });
    } else {
      this.wards = [];
    }
  }

  private getSelectedProvinceName(): string {
    const selectedProvince = this.provinces.find(p => p.code === this.paymentForm.value.selectedProvince);
    return selectedProvince ? selectedProvince.name : '';
  }

  private getSelectedDistrictName(): string {
    const selectedDistrict = this.districts.find(d => d.code === this.paymentForm.value.selectedDistrict);
    return selectedDistrict ? selectedDistrict.name : '';
  }

  private getSelectedWardName(): string {
    const selectedWard = this.wards.find(w => w.code === this.paymentForm.value.selectedWard);
    return selectedWard ? selectedWard.name : '';
  }
}
