import { useWorkspace } from "../workspace/WorkspaceProvider";
import { PathCard } from "./PathCard";

export function Paths() {
  const { data } = useWorkspace();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">A LITTLE STRUCTURE FOR YOUR CURIOSITY</div>
          <h1>Connect the dots.</h1>
          <p>
            Thoughtful routes through concepts that are better understood
            together.
          </p>
        </div>
        <span className="outlined-count">4 LEARNING PATHS</span>
      </div>
      <div className="path-grid paths-full">
        {data.paths.map((p, i) => (
          <PathCard key={p.id} path={p} index={i} />
        ))}
      </div>
      <div className="path-principles">
        <div>
          <span>01</span>
          <h3>Start with the fundamentals</h3>
          <p>Build a mental model before testing its boundaries.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Cross the abstraction layers</h3>
          <p>See how choices in one system shape another.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Reason through the hard parts</h3>
          <p>Graduate from recognizing answers to explaining why.</p>
        </div>
      </div>
    </>
  );
}
