import { db } from './firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { notificationService } from './NotificationService';
import { activityService } from './ActivityService';

export interface PlanApprovalData {
    planId: string;
    athleteId: string;
    athleteName: string;
    planType: string;
    status: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
    approvalNotes?: string;
    rejectionReason?: string;
}

class PlanApprovalService {

    /**
     * Request approval for a training plan
     */
    async requestApproval(
        planId: string,
        athleteId: string,
        athleteName: string,
        planType: string
    ): Promise<void> {
        try {
            // Update plan status
            const planRef = doc(db, 'trainingPlans', planId);
            await updateDoc(planRef, {
                approvalStatus: 'pending',
                approvalRequestedAt: new Date().toISOString()
            });

            // Send notification to athlete
            await notificationService.sendNotification(
                athleteId,
                'PLAN_READY', // Using closest existing type
                'Nuevo plan para aprobar',
                `Tu coach ha creado un nuevo plan de ${planType}. Revísalo y apruébalo.`,
                {
                    priority: 'HIGH',
                    actionUrl: `/plan/${planId}`,
                    data: { planId, planType }
                }
            );

            // Log activity
            await activityService.createActivity(
                athleteId,
                athleteName,
                'PLAN_GENERATED',
                `Plan de ${planType} enviado para aprobación`,
                {
                    severity: 'MEDIUM',
                    requiresAction: true,
                    metadata: { planId, planType, status: 'pending' }
                }
            );

            console.log('✅ Plan approval requested:', planId);
        } catch (error) {
            console.error('❌ Error requesting plan approval:', error);
            throw error;
        }
    }

    /**
     * Approve a training plan
     */
    async approvePlan(
        planId: string,
        athleteId: string,
        athleteName: string,
        planType: string,
        notes?: string
    ): Promise<void> {
        try {
            // Update plan status
            const planRef = doc(db, 'trainingPlans', planId);
            await updateDoc(planRef, {
                approvalStatus: 'approved',
                approvalDate: new Date().toISOString(),
                approvalNotes: notes || ''
            });

            // Send notification to coach
            await notificationService.sendNotification(
                'COACH_UID', // TODO: Get actual coach ID
                'PLAN_APPROVED',
                'Plan aprobado',
                `${athleteName} aprobó el plan de ${planType}`,
                {
                    priority: 'MEDIUM',
                    actionUrl: `/athlete/${athleteId}`,
                    data: { planId, athleteId, approved: true }
                }
            );

            // Log activity
            await activityService.createActivity(
                athleteId,
                athleteName,
                'PLAN_GENERATED',
                `Plan de ${planType} aprobado`,
                {
                    severity: 'LOW',
                    requiresAction: false,
                    metadata: { planId, planType, status: 'approved', notes }
                }
            );

            console.log('✅ Plan approved:', planId);
        } catch (error) {
            console.error('❌ Error approving plan:', error);
            throw error;
        }
    }

    /**
     * Reject a training plan
     */
    async rejectPlan(
        planId: string,
        athleteId: string,
        athleteName: string,
        planType: string,
        reason: string
    ): Promise<void> {
        try {
            // Update plan status
            const planRef = doc(db, 'trainingPlans', planId);
            await updateDoc(planRef, {
                approvalStatus: 'rejected',
                rejectionDate: new Date().toISOString(),
                rejectionReason: reason
            });

            // Send notification to coach
            await notificationService.sendNotification(
                'COACH_UID', // TODO: Get actual coach ID
                'PLAN_REJECTED',
                'Plan rechazado',
                `${athleteName} rechazó el plan de ${planType}. Razón: ${reason}`,
                {
                    priority: 'HIGH',
                    actionUrl: `/athlete/${athleteId}`,
                    data: { planId, athleteId, approved: false, reason }
                }
            );

            // Log activity
            await activityService.createActivity(
                athleteId,
                athleteName,
                'PLAN_GENERATED',
                `Plan de ${planType} rechazado`,
                {
                    severity: 'HIGH',
                    requiresAction: true,
                    metadata: { planId, planType, status: 'rejected', reason }
                }
            );

            console.log('✅ Plan rejected:', planId);
        } catch (error) {
            console.error('❌ Error rejecting plan:', error);
            throw error;
        }
    }

    /**
     * Get pending approvals for an athlete
     */
    async getPendingApprovals(athleteId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, 'trainingPlans'),
                where('athleteId', '==', athleteId),
                where('approvalStatus', '==', 'pending')
            );

            const snapshot = await getDocs(q);
            const plans: any[] = [];

            snapshot.forEach((doc) => {
                plans.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return plans;
        } catch (error) {
            console.error('❌ Error getting pending approvals:', error);
            return [];
        }
    }

    /**
     * Get plan approval status
     */
    async getApprovalStatus(planId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
        try {
            const planRef = doc(db, 'trainingPlans', planId);
            const planDoc = await getDoc(planRef);

            if (!planDoc.exists()) {
                return null;
            }

            return planDoc.data().approvalStatus || null;
        } catch (error) {
            console.error('❌ Error getting approval status:', error);
            return null;
        }
    }
}

export const planApprovalService = new PlanApprovalService();
export default planApprovalService;
