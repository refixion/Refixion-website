import React from "react";
import { motion } from "framer-motion";

export function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Section({ children, className = "", ...rest }) {
  return (
    <section {...rest} className={`py-20 md:py-28 ${className}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionEyebrow({ children }) {
  return (
    <div className="text-[12px] md:text-[13px] tracking-wider uppercase font-medium text-[#666666] mb-4">
      {children}
    </div>
  );
}

export function SectionHeading({ children, className = "" }) {
  return (
    <h2 className={`text-4xl md:text-5xl tracking-tight font-semibold text-[#111111] ${className}`}>
      {children}
    </h2>
  );
}
