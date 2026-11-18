package global.vision.hat.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    @RequestMapping(
            path = {"/", "/health"},
            method = {RequestMethod.GET, RequestMethod.HEAD}
    )
    public String ping() {
        return "VisionHat API online!";
    }
}
