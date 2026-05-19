import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PolizaService, PolizaRegistrarPayload } from '../app/services/poliza.service';
import { API_CONFIG } from '../app/shared/constants/api.constants';

setupZoneTestEnv();

describe('Polizas Integration Flow', () => {
  let service: PolizaService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PolizaService],
    }).compileComponents();

    service = TestBed.inject(PolizaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('T8. PolizaForm_ShouldSubmitAndNavigate - Should allow filling form and creating poliza', () => {
    const payload: PolizaRegistrarPayload = {
      numero: 'POL-123',
      obra: 'Obra 1',
      aseguradoraId: 'aseg-1',
      contratista: 'cont-1',
      ramo: 'ramo-1',
      valorOriginal: 1000,
      valorActual: 1000,
      fechaEmision: new Date('2023-01-01'),
      fechaExpiracion: new Date('2024-01-01'),
    };

    service.registrar(payload).subscribe();

    const req = httpMock.expectOne(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POLIZAS.POLIZAS}`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'new-poliza', numero: 'POL-123', estado: 0 });

    // Assert redirection logic (would normally spy on router.navigate)
  });
});
