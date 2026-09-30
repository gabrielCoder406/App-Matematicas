// Si una pantalla falla al dibujarse, muestra el error en lugar de dejar la ventana en blanco.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  children: ReactNode;
  /** Al cambiar (p. ej., la ruta), se vuelve a intentar dibujar. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  key?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.key) return { error: null, key: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error en la interfaz:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(error.message);
    return (
      <div className="page">
        <div className="card" style={{ maxWidth: 620, margin: '60px auto' }}>
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <Icon name="alert" size={26} style={{ color: 'var(--danger)', flexShrink: 0 }} />
            <div className="stack" style={{ gap: 8 }}>
              <h2>Algo salió mal en esta pantalla</h2>
              <p className="muted" style={{ margin: 0 }}>
                {chunk ? 'No se pudo cargar una parte de la app (quizá se actualizó). Recarga la ventana.' : 'Tu progreso está guardado. Puedes volver al inicio o recargar la ventana.'}
              </p>
              <pre className="tiny faint" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error.message}</pre>
              <div className="row wrap">
                <button className="btn primary" onClick={() => location.reload()}><Icon name="refresh" size={16} /> Recargar</button>
                <a className="btn ghost" href="/">Ir al inicio</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
