declare module 'jsbarcode' {
  interface Options {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    text?: string;
    fontOptions?: string;
    font?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
    fontSize?: number;
    background?: string;
    lineColor?: string;
    margin?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    valid?: (valid: boolean) => void;
  }

  function JsBarcode(
    element: string | SVGSVGElement | HTMLCanvasElement | HTMLImageElement,
    value: string,
    options?: Options
  ): void;

  export default JsBarcode;
}
