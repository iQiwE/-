export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RentalApplication {
  id: number;
  propertyId: number;
  propertyTitle: string;
  ownerId: number;
  tenantId: number;
  tenantName: string;
  desiredStartDate: Date;
  leaseMonths: number;
  message: string | null;
  status: ApplicationStatus;
  createdAt: Date;
}

