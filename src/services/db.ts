import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Laboratory, Equipment, EquipmentRequest, LabReservation, TimeSlot, UserProfile, Department, Notification } from '../models/types';

// Notifications
export const notificationService = {
  getByUser: async (userId: string) => {
    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', userId), 
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  },
  add: async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    return addDoc(collection(db, 'notifications'), { 
      ...notification, 
      read: false, 
      createdAt: serverTimestamp() 
    });
  },
  markAsRead: async (id: string) => {
    return updateDoc(doc(db, 'notifications', id), { read: true });
  }
};

// Labs
export const labService = {
  getAll: async () => {
    const q = query(collection(db, 'labs'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Laboratory));
  },
  add: async (lab: Omit<Laboratory, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'labs'), { ...lab, createdAt: serverTimestamp() });
  },
  update: async (id: string, lab: Partial<Laboratory>) => {
    return updateDoc(doc(db, 'labs', id), lab);
  },
  delete: async (id: string) => {
    return deleteDoc(doc(db, 'labs', id));
  }
};

// Equipment
export const equipmentService = {
  getAll: async () => {
    const q = query(collection(db, 'equipment'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
  },
  getByLab: async (labId: string) => {
    const q = query(collection(db, 'equipment'), where('labId', '==', labId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
  },
  add: async (item: Omit<Equipment, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'equipment'), { ...item, createdAt: serverTimestamp() });
  },
  update: async (id: string, item: Partial<Equipment>) => {
    return updateDoc(doc(db, 'equipment', id), item);
  },
  delete: async (id: string) => {
    return deleteDoc(doc(db, 'equipment', id));
  }
};

// Requests
export const requestService = {
  getAll: async () => {
    const q = query(collection(db, 'equipmentRequests'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentRequest));
  },
  getByUser: async (userId: string) => {
    const q = query(collection(db, 'equipmentRequests'), where('studentId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentRequest));
  },
  add: async (request: Omit<EquipmentRequest, 'id' | 'createdAt'>) => {
    // Update equipment availability
    const equipRef = doc(db, 'equipment', request.equipmentId);
    await updateDoc(equipRef, {
      availableQuantity: increment(-request.quantity)
    });
    return addDoc(collection(db, 'equipmentRequests'), { ...request, createdAt: serverTimestamp() });
  },
  updateStatus: async (id: string, status: string, equipmentId?: string, quantity?: number) => {
    const reqDoc = await getDoc(doc(db, 'equipmentRequests', id));
    const reqData = reqDoc.data() as EquipmentRequest;

    if (status === 'rejected' && equipmentId && quantity) {
      // Restore availability if rejected
      const equipRef = doc(db, 'equipment', equipmentId);
      await updateDoc(equipRef, {
        availableQuantity: increment(quantity)
      });
    }
    if (status === 'completed' && equipmentId && quantity) {
        // Restore availability if returned
        const equipRef = doc(db, 'equipment', equipmentId);
        await updateDoc(equipRef, {
          availableQuantity: increment(quantity)
        });
    }

    // Create notification for student
    await notificationService.add({
      userId: reqData.studentId,
      title: `Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your request for ${reqData.equipmentName} has been ${status}.`,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
    });

    return updateDoc(doc(db, 'equipmentRequests', id), { status });
  }
};

// Reservations
export const reservationService = {
  getAll: async () => {
    const q = query(collection(db, 'labReservations'), orderBy('startTime', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabReservation));
  },
  getByLab: async (labId: string) => {
    const q = query(collection(db, 'labReservations'), where('labId', '==', labId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LabReservation));
  },
  add: async (res: Omit<LabReservation, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'labReservations'), { ...res, createdAt: serverTimestamp() });
  },
  updateStatus: async (id: string, status: string) => {
    const resDoc = await getDoc(doc(db, 'labReservations', id));
    const resData = resDoc.data() as LabReservation;

    // Create notification for student
    await notificationService.add({
      userId: resData.studentId,
      title: `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your reservation for ${resData.labName} has been ${status}.`,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
    });

    return updateDoc(doc(db, 'labReservations', id), { status });
  }
};

// Time Slots
export const timeSlotService = {
    getAll: async () => {
      const q = query(collection(db, 'timeSlots'), orderBy('startTime'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeSlot));
    },
    add: async (slot: Omit<TimeSlot, 'id'>) => {
      return addDoc(collection(db, 'timeSlots'), slot);
    },
    delete: async (id: string) => {
        return deleteDoc(doc(db, 'timeSlots', id));
    }
};

// Users
export const userService = {
    getAll: async () => {
        const q = query(collection(db, 'users'), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    }
}

// Departments
export const departmentService = {
    getAll: async () => {
        const q = query(collection(db, 'departments'), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
    },
    add: async (dept: Omit<Department, 'id' | 'createdAt'>) => {
        return addDoc(collection(db, 'departments'), { ...dept, createdAt: serverTimestamp() });
    },
    update: async (id: string, dept: Partial<Department>) => {
        return updateDoc(doc(db, 'departments', id), dept);
    },
    delete: async (id: string) => {
        return deleteDoc(doc(db, 'departments', id));
    }
}
