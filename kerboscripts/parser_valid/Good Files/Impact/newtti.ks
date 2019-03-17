
// https://www.youtube.com/watch?annotation_id=annotation_4196442851&feature=iv&src_vid=cf9Jh44kL20&v=A-wAiFFSY6o
// https://www.reddit.com/r/Kos/comments/3478p2/the_math_and_physics_of_suicide_burns/
// calculating impact time

// replace impact with periapsis to see if it only calcs the periapsis time

// cos true anomaly (cos(v))		cos(v) =  (((SMA(1-e^2))/r) - 1) / e

	local	geoimpact		IS	ADDONS:TR:IMPACTPOS.
    local	SMAA			IS	SHIP:ORBIT:SEMIMAJORAXIS.
	local	SMAB			IS	(SQRT((PERIAPSIS + SHIP:BODY:RADIUS) * (APOAPSIS + SHIP:BODY:RADIUS))).
	local	Ecce			IS	SQRT(1 - ((SMAB^2)/(SMAA^2))).
	local	radiusimp		IS	(SHIP:BODY:RADIUS + geoimpact:TERRAINHEIGHT).
	local	radiuscur	 	IS  (SHIP:ALTITUDE + SHIP:BODY:RADIUS).
	local	cosvimp			IS	((((SMAA * (1 - ecce^2)) / radiusimp) - 1) / ecce).
	local	cosvcur			IS	((((SMAA * (1 - ecce^2)) / radiuscur) - 1) / ecce).
	
// eccentric anomaly (E)			E = ArcCos [ (e + cos(v)) / (1 + e * cos(v)) ] 

	local	EcceAnomImp		IS	ARCCOS((ecce + cosvimp) / (1 + ecce * cosvimp)).
	local	EcceAnomCur		IS	ARCCOS((ecce + cosvcur) / (1 + ecce * cosvcur)).
	print 	"Current Eccentric Anomaly: " + EcceAnomCur.
		
// Mean anomaly (M)					M = E - e * sin(E)

	LOCAL	MeanAnomImp			IS ecceAnomImp - (ecce * SIN(ecceAnomImp)).
	LOCAL	MeanAnomCur			IS ecceAnomCur - (ecce * SIN(ecceAnomCur)).
	print	"Current Mean Anomaly: " + MeanAnomCur.
	
// Mean notion anomaly (n)			n = 360 / P

	local	gravmu			IS	(SHIP:BODY:MASS * CONSTANT:G).
	local	orbperiod		IS	(2 * constant:pi * SQRT((SMAA^3)/(GravMu))).
	local	meanmotion		IS	(360 / orbperiod).
	print	"current Orbital Period: " + orbperiod.
	print	"current Motion Anomaly: " + Meanmotion.
	
// Time calc

	local	deltatime		IS	(MeanAnomCur - MeanAnomImp)/Meanmotion.
	
	print	"time to impact: " + ROUND(deltatime) + " seconds.".
		
// alternative equation	t = P(E1 -e *sinE1 - (E0 - e * sinE0))

	//local	otherTime		IS	orbperiod*(EcceAnomImp - ecce * sin(EcceAnomImp) -(EcceAnomCur - ecce * sin(EcceAnomCur))).
	//local	othertime1		IS	orbperiod*(EcceAnomCur - ecce * sin(EcceAnomCur) -(EcceAnomImp - ecce * sin(EcceAnomImp))).
	//print 	othertime.
	//print	othertime1.
		
