import { ErrorBoundary } from "../../../components/ErrorBoundary.jsx";
import { OutreachTab } from "../../../components/OutreachTab.jsx";

/** Pipeline（外联看板）：ErrorBoundary + OutreachTab */
export function PipelineTab(props) {
  return (
    <ErrorBoundary>
      <OutreachTab {...props} />
    </ErrorBoundary>
  );
}
