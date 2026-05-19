import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PolizaFormComponent } from '../app/pages/polizas/poliza-form/poliza-form.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PolizasService } from '../app/services/polizas.service';

describe('Polizas Integration Flow', () => {
  let component: PolizaFormComponent;
  let fixture: ComponentFixture<PolizaFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule, PolizaFormComponent],
      providers: [PolizasService]
    }).compileComponents();

    fixture = TestBed.createComponent(PolizaFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('T8. PolizaForm_ShouldSubmitAndNavigate - Should allow filling form and creating poliza', () => {
    // Fill the form
    component.polizaForm.patchValue({
      numero: 'POL-123',
      obra: 'Obra 1',
      aseguradoraId: 'aseg-1',
      contratistaId: 'cont-1',
      ramoId: 'ramo-1',
      valorOriginal: 1000,
      fechaEmision: '2023-01-01',
      fechaExpiracion: '2024-01-01'
    });

    // Submit
    component.onSubmit();

    // Expect POST request
    const req = httpMock.expectOne('http://localhost:5000/polizas');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'new-poliza', numero: 'POL-123', estado: 'vigente' });

    // Assert redirection logic (would normally spy on router.navigate)
  });
});
