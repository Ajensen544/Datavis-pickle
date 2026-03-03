import React, { useEffect, useRef } from "react";
import pickleConfig from "./pickleConfig";
import Court from "./Court";
import * as d3 from "d3";

/**
 * PickleballMain React component
 * Handles SVG rendering and trial logic
 */
const PickleballMain = () => {
  const svgRef = useRef(null);
  useEffect(() => {
    // Example: draw on SVG using D3 if needed
    // const svg = d3.select(svgRef.current);
    // svg.append("circle").attr("cx", 50).attr("cy", 50).attr("r", 10).style("fill", "red");
  }, []);
  return (
    <div>
      <h2>Pickleball Physics Experiment</h2>
      <Court config={pickleConfig} />
      {/* Optionally, add SVG overlay for D3 or trial logic */}
      {/* <svg ref={svgRef} width={...} height={...}></svg> */}
    </div>
  );
};

export default PickleballMain;