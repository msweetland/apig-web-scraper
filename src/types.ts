export enum ReturnType {
  HTML = 'HTML',
  InnerText = 'InnerText'
}

export interface RequestBody {
  url: string;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
  }>;
  returnType: ReturnType;
  timeoutMs?: number;
}