export class Relation {
  public id?: string | number;
  public relationtype!: string;
  public properties: any = {};
  public arrows!: {
    to: { enabled: false; scaleFactor: [1, 0, 3, 0.05]; type: 'arrow' };
    middle: { enabled: false; scaleFactor: [1, 0, 3, 0.05]; type: 'arrow' };
    from: { enabled: false; scaleFactor: [1, 0, 3, 0.05]; type: 'arrow' };
  };
  public arrowStrikethrough!: true;
  public color?: {
    color: string;
    highlight: string;
    hover: string;
    inherit?: string;
    opacity: number;
  };
  public dashes!: boolean;
  public font!: {
    color: ['color', '#343434'];
    size: [14, 0, 100, 1]; // px
    face: ['arial', 'verdana', 'tahoma'];
    background: ['color', 'none'];
    strokeWidth: [2, 0, 50, 1]; // px
    strokeColor: ['color', '#ffffff'];
    align: ['horizontal', 'top', 'middle', 'bottom'];
  };
  public hidden!: false;
  public hoverWidth!: [1.5, 0, 5, 0.1];
  public labelHighlightBold!: true;
  public physics!: true;
  public scaling!: {
    min: [1, 0, 100, 1];
    max: [15, 0, 100, 1];
    label: {
      enabled: true;
      min: [14, 0, 200, 1];
      max: [30, 0, 200, 1];
      maxVisible: [30, 0, 200, 1];
      drawThreshold: [5, 0, 20, 1];
    };
  };
  public selectionWidth!: [1.5, 0, 5, 0.1];
  public selfReferenceSize!: [20, 0, 200, 1];
  public shadow!: {
    enabled: false;
    color: 'rgba(0,0,0,0.5)';
    size: [10, 0, 20, 1];
    x: [5, -30, 30, 1];
    y: [5, -30, 30, 1];
  };
  public smooth!:
    | {
        enabled: true;
        type: [
          'dynamic',
          'continuous',
          'discrete',
          'diagonalCross',
          'straightCross',
          'horizontal',
          'vertical',
          'curvedCW',
          'curvedCCW',
          'cubicBezier',
        ];
        forceDirection: ['horizontal', 'vertical', 'none'];
        roundness: [0.5, 0, 1, 0.05];
      }
    | boolean;
  public width!: number;
  public to: any;
  public from: any;
  public label: any;
  public displayname!: string;
  public _key: any;
}
