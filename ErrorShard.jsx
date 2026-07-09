import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorShard extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("VOID crash boundary:", error, info);
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div
          className="ink-border bg-card p-6 max-w-sm text-center"
          style={{ clipPath: "polygon(0 0,100% 4%,97% 100%,3% 96%)" }}
        >
          <AlertTriangle className="mx-auto mb-3 text-orange" size={28} />
          <h2 className="font-display text-lg mb-1">Panel broke.</h2>
          <p className="text-sm text-inksoft mb-4">
            Something crashed on this render. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-orange text-white text-sm font-medium border-b-4 border-orange-deep active:border-b-0 active:translate-y-1"
          >
            Reload VOID
          </button>
        </div>
      </div>
    );
  }
}
