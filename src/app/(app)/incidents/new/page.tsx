import { getRinks } from "../actions";
import { NewIncidentForm } from "./NewIncidentForm";

export default async function NewIncidentPage() {
  const rinksResult = await getRinks();
  const rinks = rinksResult.success ? rinksResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Incident</h1>
        <p className="mt-1 text-muted-foreground">
          File a new incident report for this facility
        </p>
      </div>
      <NewIncidentForm rinks={rinks} />
    </div>
  );
}
