import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RenovacionService } from '../app/services/renovacion.service';
import { API_CONFIG } from '../app/shared/constants/api.constants';

setupZoneTestEnv();

describe('Renovaciones Integration Flow', () => {
  let service: RenovacionService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RenovacionService],
    }).compileComponents();

    service = TestBed.inject(RenovacionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('T10. RenovacionesView_ShouldAllowApproval - Should approve a renewal', () => {
    const renovacionId = '123';
    service.confirmarRenovacion(renovacionId, 1200).subscribe();

    const req = httpMock.expectOne(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RENOVACIONES.CONFIRMAR(renovacionId)}`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nuevoValor: 1200 });
    req.flush({ success: true });
  });
});
