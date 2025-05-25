// Validación de formularios
(function () {
    'use strict';
    
    // Obtener todos los formularios a los que queremos aplicar estilos de validación de Bootstrap personalizados
    const forms = document.querySelectorAll('.needs-validation');
    
    // Bucle sobre ellos y evitar el envío
    Array.from(forms).forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
})();

// Manejo del envío del formulario de contacto
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const form = this;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    
    if (form.checkValidity()) {
        // Simular envío (en un caso real, usarías fetch o AJAX aquí)
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
        
        setTimeout(function() {
            // Mostrar alerta de éxito
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
            alertDiv.innerHTML = `
                <strong>¡Mensaje enviado!</strong> Nos pondremos en contacto contigo pronto.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            form.parentNode.insertBefore(alertDiv, form.nextSibling);
            
            // Resetear formulario
            form.reset();
            form.classList.remove('was-validated');
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Desplazarse a la alerta
            alertDiv.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
    }
});

// Inicializar tooltips para los iconos de información
document.querySelectorAll('.form-text i[data-bs-toggle="tooltip"]').forEach(function(element) {
    new bootstrap.Tooltip(element, {
        placement: 'right'
    });
});