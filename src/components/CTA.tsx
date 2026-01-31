import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join thousands of creators building the future. 
            Start your journey today.
          </p>
          <Button variant="hero" size="lg">
            Start building
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
