import { getRinks } from "../actions";
import { NewAirQualityForm } from "./NewAirQualityForm";

export default async function NewAirQualityReadingPage() {
  const rinksResult = await getRinks();
  const rinks = rinksResult.success ? rinksResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          New Air Quality Reading
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter air quality measurements for monitoring
        </p>
      </div>
      <NewAirQualityForm rinks={rinks} />
    </div>
  );
}
