// Despachador de figuras de los enunciados.
import type { Visual as VisualSpec } from '../../content/types';
import { ColumnChart, ScatterChart } from '../charts/Charts';
import { Circuit } from './Circuit';
import { FunctionGraph } from './FunctionGraph';
import { DataTable, FractionBars, NumberLine, RightTriangle, Shape, Solid, Thales, Triangle, UnitCircleStatic, VectorsStatic } from './Geometry';
import { VennDiagram } from './VennDiagram';

export function Visual({ spec }: { spec: VisualSpec }) {
  switch (spec.type) {
    case 'graph':
      return (
        <FunctionGraph
          functions={spec.functions.map((f, i) => ({ expr: f.expr, label: f.label, dashed: f.dashed, slot: Math.min(3, i + 1) }))}
          points={spec.points}
          view={spec.view}
          shade={spec.shade}
          height={320}
        />
      );
    case 'right-triangle':
      return <RightTriangle {...spec} />;
    case 'triangle':
      return <Triangle sides={spec.sides} angles={spec.angles} />;
    case 'shape':
      return <Shape shape={spec.shape} labels={spec.labels} />;
    case 'solid':
      return <Solid shape={spec.shape} labels={spec.labels} />;
    case 'thales':
      return <Thales a={spec.a} b={spec.b} c={spec.c} d={spec.d} />;
    case 'venn':
      return <VennDiagram sets={spec.sets} elements={spec.elements} height={240} />;
    case 'circuit':
      return <Circuit expr={spec.expr} inputs={spec.inputs} showValues={false} />;
    case 'histogram':
      return <ColumnChart data={spec.bins.map((b) => ({ label: b.label, value: b.value }))} touching xLabel={spec.xLabel} yLabel={spec.yLabel} labelMax={false} />;
    case 'scatter':
      return <ScatterChart points={spec.points} xLabel={spec.xLabel} yLabel={spec.yLabel} />;
    case 'unit-circle':
      return <UnitCircleStatic angleDeg={spec.angleDeg} />;
    case 'vectors':
      return <VectorsStatic vectors={spec.vectors} />;
    case 'fraction-bars':
      return <FractionBars fractions={spec.fractions} />;
    case 'table':
      return <DataTable headers={spec.headers} rows={spec.rows} />;
    case 'number-line':
      return <NumberLine points={spec.points} ranges={spec.ranges} min={spec.min} max={spec.max} />;
    default:
      return null;
  }
}
