import { Router, type IRouter } from "express";
import healthRouter from "./health";
import classesRouter from "./classes";
import studentsRouter from "./students";
import testsRouter from "./tests";
import resultsRouter from "./results";
import uploadsRouter from "./uploads";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/classes", classesRouter);
router.use("/students", studentsRouter);
router.use("/tests", testsRouter);
router.use("/results", resultsRouter);
router.use("/uploads", uploadsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
