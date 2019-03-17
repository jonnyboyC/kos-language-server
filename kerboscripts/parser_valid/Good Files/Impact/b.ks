
// https://www.youtube.com/watch?annotation_id=annotation_4196442851&feature=iv&src_vid=cf9Jh44kL20&v=A-wAiFFSY6o
// https://www.reddit.com/r/Kos/comments/3478p2/the_math_and_physics_of_suicide_burns/
// calculating impact time

FUNCTION TiToIm {
// cos true anomaly

		LOCAL ecc 					IS SHIP:ORBIT:ECCENTRICITY.
        LOCAL sma 					IS SHIP:ORBIT:SEMIMAJORAXIS.
        LOCAL impactRadius 			IS SHIP:GEOPOSITION:TERRAINHEIGHT + SHIP:BODY:RADIUS.
        LOCAL currentRadius 		IS SHIP:ALTITUDE + SHIP:BODY:RADIUS.
        LOCAL impactTrueAnomalyCos	IS ((sma * (1-ecc^2) / impactRadius) - 1) / ecc.
        LOCAL currentTrueAnomalyCos IS ((sma * (1-ecc^2) / currentRadius) - 1) / ecc.
		
// eccentric anomaly

		LOCAL eccAnomImp 			IS ARCCOS((ecc + impactTrueAnomalyCos)/(1 + ecc * impactTrueAnomalyCos)).
		LOCAL eccAnomCur			IS ARCCOS((ecc + currentTrueAnomalyCos)/(1 + ecc * currentTrueAnomalyCos)).
		
// Mean anomaly

		LOCAL MeanAnomImp			IS eccAnomImp - (ecc * SIN(eccAnomImp)).
		LOCAL MeanAnomCur			IS eccAnomCur - (ecc * SIN(eccAnomCur)).
		
// Mean notion anomaly
	
		LOCAL MeanNotion			IS (360 / SHIP:ORBIT:PERIOD).
		
// Time calc

		SET   TimeToImpact			TO ((MeanAnomCur - MeanAnomImp) / MeanNotion).

		PRINT TimeToImpact.
		PRINT Impactradius.
}

TiToIM().



