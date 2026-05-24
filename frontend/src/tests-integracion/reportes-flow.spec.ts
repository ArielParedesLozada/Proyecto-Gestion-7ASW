import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ControlMaestroService } from '../app/services/control-maestro.service';
import { API_CONFIG } from '../app/shared/constants/api.constants';

setupZoneTestEnv();

describe('Reportes Integration Flow', () => {
  let service: ControlMaestroService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ControlMaestroService],
    }).compileComponents();

    service = TestBed.inject(ControlMaestroService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('T12. ReportesView_ShouldGenerateControlMaestro - API call checking', () => {
    service.getControlMaestro().subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.startsWith(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTES.CONTROL_MAESTRO}`),
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      vigentes: { items: [], total: 0, page: 1, pageSize: 10 },
      vencidas: { items: [], total: 0, page: 1, pageSize: 10 },
      totalVigentes: 0,
      totalVencidas: 0,
      saldoInicial: 0,
      cuadreTotal: 0,
    });
  });
});
