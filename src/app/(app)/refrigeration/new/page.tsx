import { getCompressors } from "../actions";
import { NewReadingForm } from "./NewReadingForm";

export default async function NewRefrigerationReadingPage() {
  const compressorsResult = await getCompressors();
  const compressors = compressorsResult.success ? compressorsResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Reading</h1>
        <p className="mt-1 text-muted-foreground">
          Enter refrigeration system readings
        </p>
      </div>
      <NewReadingForm compressors={compressors} />
    </div>
  );
}
