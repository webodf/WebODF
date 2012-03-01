#import "NativeZip.h"
#import "zip.h"

@implementation NativeZip
@synthesize callbackID;

-(void)loadAsString:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options  
{
    //The first argument in the arguments parameter is the callbackID.
    //We use this to send data back to the successCallback or failureCallback
    //through PluginResult.   n 
    self.callbackID = [arguments objectAtIndex:0];
    
    //Get the string that javascript sent us 
    NSString *zipPath = [arguments objectAtIndex:1];
    NSString *entryPath = [arguments objectAtIndex:2];   
  
    readZipEntry(zipPath, 0);
    
	NSFileHandle* file = [NSFileHandle fileHandleForReadingAtPath:zipPath];
    
    NSString* jsString = nil;
	if(!file) {
		jsString = [[NSString alloc] initWithString: @"cannot open file"];
    } else {
	    NSData* readData = [file readDataToEndOfFile];
        [file closeFile];
        NSString* pNStrBuff = nil;
        if (readData) {
            pNStrBuff = [[NSString alloc] initWithBytes: [readData bytes] length: [readData length] encoding: NSUTF8StringEncoding];
        } else {
            // return empty string if no data
            pNStrBuff = [[NSString alloc] initWithString: @"fail"];
        }
        jsString = pNStrBuff;
    }

    NSMutableString *stringToReturn = [NSMutableString stringWithString: @"StringReceived:"];
    
    [stringToReturn appendString: zipPath];
    [stringToReturn appendString: @"->"];
    [stringToReturn appendString: entryPath];
    
    PluginResult* pluginResult = [PluginResult
                                  resultWithStatus:PGCommandStatus_OK
                                  messageAsString: jsString
                                  ];
    
    if([zipPath isEqualToString:@"HelloWorld"]==YES) {
        [self writeJavascript: [pluginResult toSuccessCallbackString:self.callbackID]];
    } else {
        [self writeJavascript: [pluginResult toErrorCallbackString:self.callbackID]];
    }
}

@end
