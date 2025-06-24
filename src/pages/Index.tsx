
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Your App</h1>
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-800 transition-colors">
                Home
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-800 transition-colors">
                About
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-800 transition-colors">
                Contact
              </a>
              <Button variant="default" size="sm">
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-slate-800 leading-tight">
            Welcome to Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}New Project
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            This is a clean, minimal template ready for you to customize and build upon. 
            Start creating something amazing today.
          </p>
          <div className="flex justify-center space-x-4 pt-6">
            <Button size="lg" className="px-8">
              Get Started
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Feature One</CardTitle>
              <CardDescription>
                Add your first feature description here. Explain what makes this special.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Customize this card with your own content, icons, and styling to match your project needs.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Feature Two</CardTitle>
              <CardDescription>
                Describe your second key feature and its benefits to users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                This template is fully responsive and uses modern design principles for the best user experience.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-xl text-slate-800">Feature Three</CardTitle>
              <CardDescription>
                Highlight your third feature and why it matters to your audience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Built with modern technologies including React, TypeScript, and Tailwind CSS for optimal performance.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 Your App. Ready to be customized for your project.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
