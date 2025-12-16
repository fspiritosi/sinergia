import { getPlanTrabajo } from "./components/actions"
import { PlanTrabajoDetailView } from "./components/plan-trabajo-detail-view"

interface PlanTrabajoDetailProps {
  planTrabajoId: string
}

async function PlanTrabajoDetail({ planTrabajoId }: PlanTrabajoDetailProps) {
  const plan = await getPlanTrabajo(planTrabajoId)

  if (!plan) {
    return <div>Plan de trabajo no encontrado</div>
  }

  return <PlanTrabajoDetailView plan={plan} />
}

export default PlanTrabajoDetail
