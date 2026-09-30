// Catálogo de errores frecuentes: nombre legible y habilidad base que conviene reforzar.
import type { BugId } from '../math/mutations';

export interface ErrorInfo {
  label: string;
  /** Habilidad prerrequisito que explica el error (para inyectar refuerzo). */
  skill: string;
  tip: string;
}

const R = String.raw;

export const ERROR_CATALOG: Record<BugId, ErrorInfo> = {
  'sign.term': { label: 'Signo al trasponer un término', skill: 'arith.signs', tip: R`Al pasar un término al otro miembro cambia de signo: $x + 5 = 9 \Rightarrow x = 9 - 5$.` },
  'sign.side': { label: 'Signo de un miembro', skill: 'arith.signs', tip: R`Controla el signo de cada miembro después de despejar.` },
  'sign.distribute-neg': { label: 'Menos delante de un paréntesis', skill: 'arith.signs', tip: R`$-(a - b) = -a + b$: el signo afecta a todos los términos.` },
  'sign.product': { label: 'Regla de los signos', skill: 'arith.signs', tip: R`$(-)\cdot(-)=+$ y $(-)\cdot(+)=-$.` },
  'distribute.partial': { label: 'Distributiva incompleta', skill: 'alg.like-terms', tip: R`$k(a+b)=ka+kb$: multiplica todos los términos.` },
  'pow.sum': { label: 'Potencia de una suma', skill: 'alg.notable-products', tip: R`$(a+b)^2 = a^2 + 2ab + b^2$, no $a^2+b^2$.` },
  'pow.product-exp': { label: 'Producto de potencias de igual base', skill: 'arith.powers', tip: R`$x^a\cdot x^b = x^{a+b}$ (se suman los exponentes).` },
  'pow.power-exp': { label: 'Potencia de potencia', skill: 'arith.powers', tip: R`$(x^a)^b = x^{a\cdot b}$ (se multiplican los exponentes).` },
  'pow.quotient-exp': { label: 'Cociente de potencias', skill: 'arith.powers', tip: R`$x^a : x^b = x^{a-b}$ (se restan los exponentes).` },
  'pow.base-times-exp': { label: 'Potencia como multiplicación', skill: 'arith.powers', tip: R`$2^3 = 2\cdot2\cdot2 = 8$, no $2\cdot 3$.` },
  'pow.neg-base': { label: 'Signo y potencia', skill: 'arith.powers', tip: R`$-3^2 = -9$ pero $(-3)^2 = 9$.` },
  'pow.neg-exp': { label: 'Exponente negativo', skill: 'arith.powers', tip: R`$a^{-n}=\frac{1}{a^n}$.` },
  'pow.partial-product': { label: 'Potencia de un producto', skill: 'arith.powers', tip: R`$(2x)^3 = 8x^3$: el exponente afecta a todos los factores.` },
  'root.sum': { label: 'Raíz de una suma', skill: 'arith.roots', tip: R`$\sqrt{a+b}\neq\sqrt a+\sqrt b$.` },
  'frac.add-num-den': { label: 'Suma de fracciones', skill: 'arith.fractions', tip: R`Para sumar fracciones busca un denominador común; nunca sumes los denominadores.` },
  'frac.cancel-terms': { label: 'Simplificación de términos', skill: 'alg.factoring', tip: R`Solo se simplifican factores: primero factoriza.` },
  'frac.reciprocal-sum': { label: 'Inversa de una suma', skill: 'arith.fractions', tip: R`$\frac{1}{a+b}\neq\frac1a+\frac1b$.` },
  'frac.div-no-invert': { label: 'División de fracciones', skill: 'arith.fractions', tip: R`Dividir es multiplicar por la inversa.` },
  'frac.mul-cross': { label: 'Multiplicación de fracciones', skill: 'arith.fractions', tip: R`Numerador por numerador y denominador por denominador.` },
  'eq.coef-subtract': { label: 'Despeje de un coeficiente', skill: 'alg.linear-equations', tip: R`$3x = 12 \Rightarrow x = \frac{12}{3}$: el coeficiente pasa dividiendo.` },
  'eq.coef-sign': { label: 'Coeficiente negativo', skill: 'arith.signs', tip: R`$-2x = 8 \Rightarrow x = \frac{8}{-2} = -4$.` },
  'eq.div-instead-mul': { label: 'Despeje de un divisor', skill: 'alg.linear-equations', tip: R`$\frac{x}{3} = 4 \Rightarrow x = 4\cdot3$.` },
  'eq.mul-instead-div': { label: 'Despeje de un factor', skill: 'alg.linear-equations', tip: R`$3x = 12 \Rightarrow x = 12 : 3$.` },
  'eq.partial-divide': { label: 'División parcial de un miembro', skill: 'alg.linear-equations', tip: R`Si divides un miembro, divide todos sus términos.` },
  'ineq.flip': { label: 'Sentido de la desigualdad', skill: 'alg.linear-inequalities', tip: R`Al multiplicar o dividir por un negativo, la desigualdad se invierte.` },
  'logic.demorgan': { label: 'Leyes de De Morgan', skill: 'logic.laws', tip: R`$\neg(p\land q)\equiv\neg p\lor\neg q$: se niegan ambas y cambia el conector.` },
  'logic.demorgan-partial': { label: 'De Morgan incompleto', skill: 'logic.laws', tip: R`Al negar, niega las dos proposiciones.` },
  'logic.implication': { label: 'Equivalencia de la implicación', skill: 'logic.laws', tip: R`$p\Rightarrow q\equiv\neg p\lor q$.` },
  'logic.converse': { label: 'Recíproca y contraria', skill: 'logic.laws', tip: R`Solo la contrarrecíproca $\neg q\Rightarrow\neg p$ equivale a $p\Rightarrow q$.` },
  'logic.neg-implication': { label: 'Negación de la implicación', skill: 'logic.laws', tip: R`$\neg(p\Rightarrow q)\equiv p\land\neg q$.` },
  'logic.double-neg': { label: 'Doble negación', skill: 'logic.connectives', tip: R`$\neg\neg p\equiv p$.` },
  'logic.distributive': { label: 'Distributiva lógica', skill: 'logic.laws', tip: R`$p\land(q\lor r)\equiv(p\land q)\lor(p\land r)$.` },
  'logic.connective-swap': { label: 'Evaluación de conectores', skill: 'logic.connectives', tip: R`$\land$: ambas V; $\lor$: al menos una V.` },
  'set.demorgan': { label: 'De Morgan en conjuntos', skill: 'sets.operations', tip: R`$(A\cup B)^c = A^c\cap B^c$.` },
  'set.diff-order': { label: 'Orden de la diferencia', skill: 'sets.operations', tip: R`$A-B\neq B-A$.` },
  'set.op-swap': { label: 'Unión e intersección', skill: 'sets.operations', tip: R`Unión: en uno u otro. Intersección: en ambos.` },
};

/** Errores de evaluación de conectores en tablas de verdad (se registran aparte). */
export const CONNECTIVE_ERROR_LABEL: Record<string, string> = {
  not: 'Negación mal evaluada',
  and: 'Conjunción mal evaluada',
  or: 'Disyunción mal evaluada',
  xor: 'Disyunción exclusiva mal evaluada',
  implies: 'Implicación mal evaluada',
  iff: 'Bicondicional mal evaluado',
};

export function errorLabel(id: string): string {
  if (id in ERROR_CATALOG) return ERROR_CATALOG[id as BugId].label;
  if (id.startsWith('connective.')) return CONNECTIVE_ERROR_LABEL[id.slice(11)] ?? 'Conector mal evaluado';
  if (id === 'form.not-simplified') return 'Resultado sin simplificar';
  if (id === 'form.not-factored') return 'Factorización incompleta';
  if (id === 'form.not-expanded') return 'Expresión sin desarrollar';
  if (id === 'solutions.missing') return 'Soluciones incompletas';
  if (id === 'solutions.extra') return 'Soluciones de más';
  return 'Otro error';
}

export function errorSkill(id: string): string | undefined {
  if (id in ERROR_CATALOG) return ERROR_CATALOG[id as BugId].skill;
  if (id.startsWith('connective.')) return 'logic.connectives';
  if (id === 'form.not-simplified') return 'arith.fractions';
  if (id === 'form.not-factored') return 'alg.factoring';
  if (id === 'solutions.missing') return 'alg.quadratic';
  return undefined;
}
