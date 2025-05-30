import React from 'react';
import { Star, Quote, Building2, TrendingUp, Users, DollarSign } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "The custom AI solution transformed our sales process completely. Our team now focuses on high-value conversations while AI handles the research and initial outreach. We've seen a 40% increase in qualified leads and our sales cycle shortened by 3 weeks.",
      author: "Sarah Chen",
      title: "VP of Sales",
      company: "TechFlow Solutions",
      industry: "B2B Software",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      quote: "Before implementing AI automation, our marketing team spent 60% of their time on manual content creation and campaign management. Now they focus on strategy while AI handles execution. Our campaign performance improved by 65% and content production scaled 3x.",
      author: "Marcus Rodriguez",
      title: "Marketing Director", 
      company: "GrowthLab Agency",
      industry: "Digital Marketing",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      quote: "The financial automation AI we implemented has been game-changing. What used to take our accounting team days of manual reconciliation now happens automatically with 99.8% accuracy. We've reduced month-end closing from 12 days to 3 days.",
      author: "David Park",
      title: "CFO",
      company: "MidSize Manufacturing",
      industry: "Manufacturing",
      icon: DollarSign,
      color: "text-emerald-600", 
      bgColor: "bg-emerald-50"
    },
    {
      quote: "The custom AI knowledge system we built has revolutionized how our team accesses company information. Instead of searching through documents for hours, our staff gets instant, accurate answers. It's like having an expert consultant available 24/7.",
      author: "Jennifer Liu",
      title: "Operations Manager",
      company: "ServicePro Corp",
      industry: "Professional Services",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const stats = [
    { value: "150+", label: "Businesses Transformed", description: "Across marketing, sales, and finance operations" },
    { value: "89%", label: "Average Efficiency Gain", description: "Measured across all implemented AI solutions" },
    { value: "2-6 weeks", label: "Implementation Time", description: "From discovery to fully operational AI system" },
    { value: "24/7", label: "AI Operation", description: "Continuous automation without human intervention" }
  ];

  return (
    <section id="testimonials" className="py-24 bg-gradient-to-b from-secondary/20 via-background to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Proven Results Across{' '}
            <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
              Every Business Division
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how businesses like yours have transformed their operations with custom AI automation solutions, achieving measurable improvements in efficiency, accuracy, and growth.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-foreground mb-1">{stat.label}</div>
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20"
            >
              {/* Quote Icon */}
              <div className="flex items-start mb-6">
                <div className={`inline-flex p-3 rounded-lg ${testimonial.bgColor} mr-4`}>
                  <testimonial.icon className={`h-6 w-6 ${testimonial.color}`} />
                </div>
                <Quote className="h-8 w-8 text-primary/20" />
              </div>

              {/* Star Rating */}
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-foreground text-lg leading-relaxed mb-6 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author Info */}
              <div className="border-t border-border pt-6">
                <div className="font-semibold text-foreground text-lg">{testimonial.author}</div>
                <div className="text-primary font-medium">{testimonial.title}</div>
                <div className="text-muted-foreground">{testimonial.company}</div>
                <div className="text-sm text-muted-foreground mt-1">{testimonial.industry}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-violet-600/10 rounded-2xl p-8 md:p-12 text-center border border-primary/20">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Business Operations?
            </h3>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Join hundreds of businesses that have revolutionized their marketing, sales, and finance operations with custom AI automation. Your transformation story starts with a single conversation.
            </p>
            
            {/* Business Areas */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border">
                <div className="text-2xl font-bold text-foreground mb-2">Marketing AI</div>
                <div className="text-muted-foreground text-sm">
                  Content creation, campaign automation, and lead intelligence
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border">
                <div className="text-2xl font-bold text-foreground mb-2">Sales AI</div>
                <div className="text-muted-foreground text-sm">
                  Prospect research, outreach automation, and performance optimization
                </div>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border">
                <div className="text-2xl font-bold text-foreground mb-2">Finance AI</div>
                <div className="text-muted-foreground text-sm">
                  Automated reconciliation, reporting, and predictive forecasting
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Next Steps:</strong> Schedule a discovery call to discuss your specific automation needs and see how AI can transform your business operations.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 