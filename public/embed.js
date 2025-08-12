(function() {
  'use strict';
  
  // Configuration
  const FORM_BUILDER_URL = window.FORM_BUILDER_URL || 'http://localhost:3000';
  
  // Find all embed scripts
  const scripts = document.querySelectorAll('script[data-form]');
  
  scripts.forEach(function(script) {
    const formId = script.getAttribute('data-form');
    const containerId = script.getAttribute('data-container');
    const utm = script.getAttribute('data-utm') === 'true';
    const height = script.getAttribute('data-height') || 'auto';
    const theme = script.getAttribute('data-theme') || 'light';
    
    if (!formId) {
      console.error('Form Builder Embed: data-form attribute is required');
      return;
    }
    
    // Create iframe
    const iframe = document.createElement('iframe');
    const params = new URLSearchParams();
    
    // Add UTM parameters if enabled
    if (utm) {
      const urlParams = new URLSearchParams(window.location.search);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(key) {
        const value = urlParams.get(key);
        if (value) params.append(key, value);
      });
    }
    
    // Add embed flag
    params.append('embed', 'true');
    params.append('theme', theme);
    
    // Set iframe attributes
    iframe.src = FORM_BUILDER_URL + '/form/' + formId + '?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    
    if (height === 'auto') {
      iframe.style.height = '600px'; // Initial height
    } else {
      iframe.style.height = height;
    }
    
    // Insert iframe
    if (containerId) {
      const container = document.getElementById(containerId);
      if (container) {
        container.appendChild(iframe);
      } else {
        console.error('Form Builder Embed: Container with id "' + containerId + '" not found');
      }
    } else {
      // Insert after the script tag
      script.parentNode.insertBefore(iframe, script.nextSibling);
    }
    
    // Listen for messages from iframe for auto-height
    if (height === 'auto') {
      window.addEventListener('message', function(event) {
        if (event.origin !== FORM_BUILDER_URL) return;
        
        if (event.data.type === 'form-height' && event.data.formId === formId) {
          iframe.style.height = event.data.height + 'px';
        }
        
        if (event.data.type === 'form-submitted' && event.data.formId === formId) {
          // Trigger custom event
          const customEvent = new CustomEvent('formSubmitted', {
            detail: {
              formId: formId,
              submissionId: event.data.submissionId
            }
          });
          window.dispatchEvent(customEvent);
        }
      });
    }
  });
  
  // Public API
  window.FormBuilder = {
    // Programmatically create a form
    create: function(options) {
      if (!options.formId) {
        console.error('Form Builder: formId is required');
        return;
      }
      
      const iframe = document.createElement('iframe');
      const params = new URLSearchParams();
      
      if (options.utm) {
        const urlParams = new URLSearchParams(window.location.search);
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function(key) {
          const value = urlParams.get(key);
          if (value) params.append(key, value);
        });
      }
      
      if (options.prefill) {
        Object.keys(options.prefill).forEach(function(key) {
          params.append('prefill_' + key, options.prefill[key]);
        });
      }
      
      params.append('embed', 'true');
      params.append('theme', options.theme || 'light');
      
      iframe.src = FORM_BUILDER_URL + '/form/' + options.formId + '?' + params.toString();
      iframe.style.width = '100%';
      iframe.style.height = options.height || '600px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'hidden';
      iframe.frameBorder = '0';
      iframe.scrolling = 'no';
      
      if (options.container) {
        const container = typeof options.container === 'string' 
          ? document.getElementById(options.container)
          : options.container;
          
        if (container) {
          container.appendChild(iframe);
        }
      }
      
      // Setup event listeners
      const messageHandler = function(event) {
        if (event.origin !== FORM_BUILDER_URL) return;
        
        if (event.data.formId !== options.formId) return;
        
        if (event.data.type === 'form-height' && options.autoHeight) {
          iframe.style.height = event.data.height + 'px';
        }
        
        if (event.data.type === 'form-submitted' && options.onSubmit) {
          options.onSubmit({
            formId: options.formId,
            submissionId: event.data.submissionId
          });
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      return {
        iframe: iframe,
        destroy: function() {
          window.removeEventListener('message', messageHandler);
          iframe.remove();
        }
      };
    }
  };
})();