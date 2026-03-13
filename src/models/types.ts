export type UserRole = 'admin' | 'lecturer' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  photoURL?: string;
  createdAt: any;
}

export interface Laboratory {
  id: string;
  name: string;
  description: string;
  capacity: number;
  location: string;
  color: string;
  createdAt: any;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  labId: string;
  createdAt: any;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface EquipmentRequest {
  id: string;
  equipmentId: string;
  equipmentName: string;
  studentId: string;
  studentName: string;
  lecturerId: string;
  course: string;
  quantity: number;
  purpose: string;
  startTime: any;
  endTime: any;
  status: RequestStatus;
  pickedUp: boolean;
  returned: boolean;
  createdAt: any;
}

export interface LabReservation {
  id: string;
  labId: string;
  labName: string;
  studentId: string;
  studentName: string;
  lecturerId: string;
  course: string;
  startTime: any;
  endTime: any;
  status: RequestStatus;
  createdAt: any;
}

export interface TimeSlot {
  id: string;
  startTime: string; // e.g. "07:00"
  endTime: string;   // e.g. "08:00"
  day?: string;      // e.g. "Monday", "Tuesday", etc.
}

export interface WorkingHours {
  id: string;
  startTime: string;
  endTime: string;
  days: string[];
}

export interface Department {
  id: string;
  name: string;
  description: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: any;
}
