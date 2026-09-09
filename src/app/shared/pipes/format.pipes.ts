import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sar', standalone: true })
export class SarPipe implements PipeTransform {
  transform(value: number | null | undefined, showCurrency = true): string {
    if (value == null || Number.isNaN(value)) return showCurrency ? '0 ر.س' : '0';
    const formatted = new Intl.NumberFormat('ar-SA').format(Math.round(value));
    return showCurrency ? `${formatted} ر.س` : formatted;
  }
}

@Pipe({ name: 'arNumber', standalone: true })
export class ArNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '0';
    return new Intl.NumberFormat('ar-SA').format(value);
  }
}
