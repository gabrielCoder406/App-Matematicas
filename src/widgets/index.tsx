// Registro de modelos interactivos (usados en las microlecciones y en el laboratorio).
import type { ComponentType } from 'react';
import type { BlockId, WidgetId } from '../content/types';
import { BalanceWidget, FractionBarsWidget, NumberLineWidget } from './algebraWidgets';
import { MatrixWidget, PythagorasWidget, ThalesWidget, TriangleSolverWidget, UnitCircleWidget, VectorsWidget } from './geometryWidgets';
import { GrapherWidget, RiemannWidget, TangentWidget } from './graphWidgets';
import { CircuitWidget, PropTreeWidget, TruthTableWidget, VennWidget } from './logicWidgets';
import { DiceWidget, HistogramWidget } from './statsWidgets';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWidget = ComponentType<any>;

export interface WidgetInfo {
  id: WidgetId;
  title: string;
  description: string;
  icon: string;
  block: BlockId;
  component: AnyWidget;
  /** Parámetros iniciales en el laboratorio. */
  lab?: Record<string, unknown>;
}

export const WIDGETS: WidgetInfo[] = [
  { id: 'grapher', title: 'Graficador con parámetros', description: 'Grafica hasta tres funciones; cada letra que no sea x se vuelve un deslizador. Raíces, extremos e intersecciones.', icon: 'chart', block: 'funciones', component: GrapherWidget, lab: { functions: ['a*x^2 + b*x + c'], params: { a: 1, b: 0, c: -4 }, showRoots: true } },
  { id: 'truth-table', title: 'Tabla de verdad reactiva', description: 'Escribe una proposición y obtén su tabla completa y su clasificación.', icon: 'grid', block: 'logica', component: TruthTableWidget },
  { id: 'prop-tree', title: 'Árbol de la proposición', description: 'Nodos reactivos: cambia los valores de las variables y observa cómo se propagan.', icon: 'map', block: 'logica', component: PropTreeWidget },
  { id: 'venn', title: 'Diagramas de Venn', description: 'De la fórmula a la región y de la región a la fórmula, con 2 o 3 conjuntos.', icon: 'target', block: 'logica', component: VennWidget, lab: { sets: 3, expr: '(A ∪ B) ∩ C' } },
  { id: 'circuit', title: 'Compuertas lógicas', description: 'Enciende entradas y conmuta compuertas AND, OR y XOR.', icon: 'sparkles', block: 'logica', component: CircuitWidget },
  { id: 'balance', title: 'Balanza de ecuaciones', description: 'Resuelve ecuaciones quitando lo mismo de ambos platos.', icon: 'hand', block: 'algebra', component: BalanceWidget, lab: { a: 4, b: 1, c: 2, d: 7 } },
  { id: 'fraction-bars', title: 'Barras de fracciones', description: 'Compara y suma fracciones con denominador común.', icon: 'list', block: 'aritmetica', component: FractionBarsWidget },
  { id: 'number-line', title: 'Inecuaciones en la recta', description: 'Escribe una inecuación y mira su conjunto solución.', icon: 'minus', block: 'algebra', component: NumberLineWidget },
  { id: 'unit-circle', title: 'Círculo unitario', description: 'Arrastra el ángulo y lee seno, coseno y tangente.', icon: 'compass', block: 'geometria', component: UnitCircleWidget },
  { id: 'pythagoras', title: 'Teorema de Pitágoras', description: 'Los cuadrados sobre los catetos suman el cuadrado de la hipotenusa.', icon: 'grid', block: 'geometria', component: PythagorasWidget },
  { id: 'thales', title: 'Teorema de Tales', description: 'Paralelas que cortan transversales en segmentos proporcionales.', icon: 'list', block: 'geometria', component: ThalesWidget },
  { id: 'triangle-solver', title: 'Resolución de triángulos', description: 'Razones trigonométricas y teoremas del seno y del coseno en vivo.', icon: 'compass', block: 'geometria', component: TriangleSolverWidget, lab: { mode: 'general' } },
  { id: 'tangent', title: 'Recta tangente y derivada', description: 'La secante se vuelve tangente cuando h → 0.', icon: 'pen', block: 'calculo', component: TangentWidget },
  { id: 'riemann', title: 'Sumas de Riemann', description: 'Aproxima el área bajo la curva con rectángulos.', icon: 'chart', block: 'calculo', component: RiemannWidget },
  { id: 'vectors', title: 'Vectores en el plano', description: 'Suma, módulo, producto escalar y ángulo entre vectores.', icon: 'send', block: 'lineal', component: VectorsWidget },
  { id: 'matrix', title: 'Matrices como transformaciones', description: 'Cómo una matriz 2×2 deforma el plano; el determinante es el área.', icon: 'grid', block: 'lineal', component: MatrixWidget },
  { id: 'histogram', title: 'Histograma y medidas', description: 'Edita los datos y observa media, mediana, moda y desviación.', icon: 'chart', block: 'estadistica', component: HistogramWidget },
  { id: 'dice', title: 'Simulador de dados', description: 'La frecuencia relativa se acerca a la probabilidad teórica.', icon: 'refresh', block: 'estadistica', component: DiceWidget },
];

export const WIDGET_BY_ID: Record<string, WidgetInfo> = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));

export function LessonWidget({ id, props }: { id: WidgetId; props?: Record<string, unknown> }) {
  const info = WIDGET_BY_ID[id];
  if (!info) return <div className="small muted">Modelo interactivo no disponible.</div>;
  const C = info.component;
  return <C {...(props ?? {})} />;
}
