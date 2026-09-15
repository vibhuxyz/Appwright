import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

// React only supports error boundaries as classes — there is no hook
// equivalent. One broken feature (e.g. the deployment panel) must not take
// down the rest of the workspace with it.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  retry = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.retry)
      ) : (
        <div className="flex flex-col items-start gap-2 p-4 text-sm text-danger">
          <span>Something went wrong: {this.state.error.message}</span>
          <button onClick={this.retry} className="underline hover:brightness-110">
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
