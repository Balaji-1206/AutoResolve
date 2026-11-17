export interface CustomerProfile {
  id: string;
  customerId: string;
  name: string;
  email: string;
  recentOrderId: string;
  recentOrderTitle: string;
  orderAmount: number;
  deliveryDate: string;
  avatarInitials: string;
}

export const CUSTOMER_PROFILES: CustomerProfile[] = [
  {
    id: "cus-1",
    customerId: "CUS-1001",
    name: "Aarav Kumar",
    email: "aarav.kumar@example.com",
    recentOrderId: "ORD-1001",
    recentOrderTitle: "Performance Running Shoes ($120.00)",
    orderAmount: 120.0,
    deliveryDate: "Delivered 14 days ago",
    avatarInitials: "AK",
  },
  {
    id: "cus-2",
    customerId: "CUS-1002",
    name: "Robert Chen",
    email: "robert.chen@example.com",
    recentOrderId: "ORD-1002",
    recentOrderTitle: "55\" 4K Ultra HD Smart TV ($750.00)",
    orderAmount: 750.0,
    deliveryDate: "Delivered 10 days ago",
    avatarInitials: "RC",
  },
  {
    id: "cus-3",
    customerId: "CUS-1005",
    name: "Devon Vance",
    email: "devon.vance@example.com",
    recentOrderId: "ORD-1005",
    recentOrderTitle: "Custom Handcrafted Wood Carving ($45.00)",
    orderAmount: 45.0,
    deliveryDate: "Delivered 8 days ago",
    avatarInitials: "DV",
  },
  {
    id: "cus-4",
    customerId: "CUS-1006",
    name: "Elena Rostova",
    email: "elena.rostova@example.com",
    recentOrderId: "ORD-1006",
    recentOrderTitle: "Home Audio Surround Speaker Set ($210.00)",
    orderAmount: 210.0,
    deliveryDate: "Tracking Status: Processing",
    avatarInitials: "ER",
  },
];
