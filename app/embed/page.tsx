import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

export default function EmbedPage() {
  const embedUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Embed Documentation</h1>
            <p className="text-lg text-muted-foreground">
              Embed your forms on any website with our simple JavaScript SDK
            </p>
          </div>

          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Embed</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="api">JavaScript API</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start</CardTitle>
                  <CardDescription>
                    Add your form to any website in seconds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">1. Copy this code</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{`<script 
  src="${embedUrl}/embed.js" 
  data-form="YOUR_FORM_ID">
</script>`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">2. Paste it into your HTML</h3>
                    <p className="text-sm text-muted-foreground">
                      Place the script tag where you want the form to appear on your page
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">3. That's it!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your form will automatically load and resize to fit its content
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Options</CardTitle>
                  <CardDescription>
                    Customize the embed behavior with additional attributes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Available Attributes</h3>
                    <div className="space-y-4">
                      <div>
                        <Badge className="mb-2">data-form</Badge>
                        <p className="text-sm text-muted-foreground">
                          Required. Your form ID or slug
                        </p>
                      </div>
                      
                      <div>
                        <Badge className="mb-2">data-container</Badge>
                        <p className="text-sm text-muted-foreground">
                          ID of the container element to render the form in
                        </p>
                      </div>
                      
                      <div>
                        <Badge className="mb-2">data-utm</Badge>
                        <p className="text-sm text-muted-foreground">
                          Set to "true" to capture UTM parameters from the parent page
                        </p>
                      </div>
                      
                      <div>
                        <Badge className="mb-2">data-height</Badge>
                        <p className="text-sm text-muted-foreground">
                          Fixed height (e.g., "600px") or "auto" for dynamic sizing
                        </p>
                      </div>
                      
                      <div>
                        <Badge className="mb-2">data-theme</Badge>
                        <p className="text-sm text-muted-foreground">
                          "light" or "dark" theme
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Example with all options</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{`<div id="my-form-container"></div>
<script 
  src="${embedUrl}/embed.js" 
  data-form="YOUR_FORM_ID"
  data-container="my-form-container"
  data-utm="true"
  data-height="auto"
  data-theme="light">
</script>`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <CardTitle>JavaScript API</CardTitle>
                  <CardDescription>
                    Programmatically control forms with our JavaScript API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Creating a form programmatically</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <code>{`<script src="${embedUrl}/embed.js"></script>
<script>
  const form = FormBuilder.create({
    formId: 'YOUR_FORM_ID',
    container: 'form-container',
    utm: true,
    autoHeight: true,
    theme: 'light',
    prefill: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    onSubmit: function(data) {
      console.log('Form submitted:', data);
      // Handle submission
    }
  });
  
  // Later, you can destroy the form
  // form.destroy();
</script>`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">API Methods</h3>
                    <div className="space-y-2">
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">FormBuilder.create(options)</code>
                        <p className="text-sm text-muted-foreground mt-1">
                          Creates a new form instance with the specified options
                        </p>
                      </div>
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">form.destroy()</code>
                        <p className="text-sm text-muted-foreground mt-1">
                          Removes the form and cleans up event listeners
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <CardTitle>Events</CardTitle>
                  <CardDescription>
                    Listen to form events for custom integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Available Events</h3>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="outline" className="mb-2">formSubmitted</Badge>
                        <p className="text-sm text-muted-foreground">
                          Fired when a form is successfully submitted
                        </p>
                        <pre className="bg-muted p-3 rounded-lg mt-2">
                          <code className="text-xs">{`window.addEventListener('formSubmitted', function(event) {
  console.log('Form ID:', event.detail.formId);
  console.log('Submission ID:', event.detail.submissionId);
});`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">PostMessage Communication</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The embed uses PostMessage for cross-domain communication. You can listen for these messages:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">form-height</code>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sent when the form height changes (for auto-resize)
                        </p>
                      </div>
                      <div>
                        <code className="text-sm bg-muted px-2 py-1 rounded">form-submitted</code>
                        <p className="text-sm text-muted-foreground mt-1">
                          Sent when the form is successfully submitted
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                If you need assistance with embedding forms or have questions about the API,
                please contact support or check our GitHub repository for examples.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}