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

  const planSafe = JSON.parse(JSON.stringify(plan))

  return <PlanTrabajoDetailView plan={planSafe} />
}

export default PlanTrabajoDetail
